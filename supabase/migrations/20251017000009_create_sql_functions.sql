-- ==============================================================================
-- SQL функции для реферальной системы, системы подарков и управления балансом
-- ==============================================================================

-- 1. Функция для поиска позиции нового рефера в дереве (макс 6 на уровне)
CREATE OR REPLACE FUNCTION find_placement_in_tree(p_inviter_id UUID)
RETURNS UUID AS $$
DECLARE
  v_referral_count INT;
  v_child_id UUID;
  v_placement_id UUID;
BEGIN
  -- Проверяем, разрешил ли inviter регистрацию новых рефералов
  IF NOT EXISTS (
    SELECT 1 FROM referral_settings 
    WHERE user_id = p_inviter_id 
    AND allow_referrer_referrals_registration = true
  ) THEN
    RETURN NULL;
  END IF;

  -- Считаем прямых рефералов inviter'а
  SELECT COUNT(*) INTO v_referral_count
  FROM referral_tree
  WHERE referrer_id = p_inviter_id AND level = 1;

  -- Если меньше 6, новый рефер становится прямым потомком
  IF v_referral_count < 6 THEN
    RETURN p_inviter_id;
  END IF;

  -- Иначе ищем место в левом поддереве (слева направо)
  SELECT referred_id INTO v_child_id
  FROM referral_tree
  WHERE referrer_id = p_inviter_id 
  AND level = 1
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_child_id IS NOT NULL THEN
    v_placement_id := find_placement_in_tree(v_child_id);
    IF v_placement_id IS NOT NULL THEN
      RETURN v_placement_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==============================================================================

-- 2. Функция для получения процента комиссии по уровню
CREATE OR REPLACE FUNCTION get_referral_commission_for_level(p_level INT)
RETURNS NUMERIC AS $$
DECLARE
  v_commission NUMERIC;
BEGIN
  SELECT commission_percent INTO v_commission
  FROM referral_commission_rules
  WHERE level = p_level;

  RETURN COALESCE(v_commission, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- ==============================================================================

-- 3. Функция для автоматической публикации истекших подарков
CREATE OR REPLACE FUNCTION auto_claim_expired_gifts()
RETURNS TABLE(gift_id UUID, status GIFT_STATUS) AS $$
BEGIN
  RETURN QUERY
  UPDATE gifts
  SET status = 'claimed'::GIFT_STATUS
  WHERE status = 'pending'::GIFT_STATUS
    AND created_at + INTERVAL '7 days' <= NOW()
    AND to_user_id IS NOT NULL
  RETURNING gifts.id, gifts.status;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================

-- 4. Функция для распределения комиссий по реферальному дереву
CREATE OR REPLACE FUNCTION distribute_referral_commission(
  p_payer_id UUID,
  p_subscription_id UUID,
  p_amount NUMERIC
)
RETURNS VOID AS $$
DECLARE
  v_referrer_id UUID;
  v_level INT;
  v_commission_percent NUMERIC;
  v_commission_amount NUMERIC;
  v_receiver_id UUID;
BEGIN
  -- Начинаем с прямого реферера
  SELECT referrer_id INTO v_referrer_id
  FROM private_users
  WHERE id = p_payer_id;

  v_level := 1;

  -- Проходим по цепочке рефералов до 9 уровней
  WHILE v_referrer_id IS NOT NULL AND v_level <= 9 LOOP
    -- Получаем процент комиссии для текущего уровня
    v_commission_percent := get_referral_commission_for_level(v_level);

    -- Проверяем, активна ли подписка у реферера
    IF EXISTS (
      SELECT 1 FROM user_subscriptions
      WHERE user_id = v_referrer_id
        AND is_active = true
    ) THEN
      -- Вычисляем сумму комиссии
      v_commission_amount := (p_amount * v_commission_percent) / 100;

      -- Добавляем комиссию в балан реферера
      UPDATE user_balances
      SET balance = balance + v_commission_amount
      WHERE user_id = v_referrer_id;

      -- Логируем операцию
      INSERT INTO referral_commissions (
        payer_user_id,
        receiver_user_id,
        level,
        amount,
        subscription_id
      ) VALUES (
        p_payer_id,
        v_referrer_id,
        v_level,
        v_commission_amount,
        p_subscription_id
      );
    END IF;

    -- Переходим к реферу на следующий уровень
    SELECT referrer_id INTO v_referrer_id
    FROM referral_tree
    WHERE referred_id = v_referrer_id
      AND level = 1
    LIMIT 1;

    v_level := v_level + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================

-- 5. Функция для принятия подарка с логикой реферала
CREATE OR REPLACE FUNCTION accept_gift(
  p_gift_id UUID,
  p_user_id UUID,
  p_accept BOOLEAN DEFAULT true
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  new_referrer_id UUID
) AS $$
DECLARE
  v_gift RECORD;
  v_current_referrer UUID;
  v_placement_id UUID;
  v_new_level INT;
BEGIN
  -- Получаем данные подарка
  SELECT * INTO v_gift FROM gifts WHERE id = p_gift_id;

  IF v_gift IS NULL THEN
    RETURN QUERY SELECT false, 'Подарок не найден'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  IF NOT p_accept THEN
    -- Отклонение подарка
    UPDATE gifts
    SET status = 'rejected'::GIFT_STATUS
    WHERE id = p_gift_id;

    RETURN QUERY SELECT true, 'Подарок отклонен'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Проверяем статус подарка
  IF v_gift.status NOT IN ('pending', 'claimed') THEN
    RETURN QUERY SELECT false, 'Подарок уже обработан'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Добавляем токены пользователю
  UPDATE user_balances
  SET balance = balance + v_gift.amount
  WHERE user_id = p_user_id;

  -- Получаем текущего реферера пользователя
  SELECT referrer_id INTO v_current_referrer
  FROM private_users
  WHERE id = p_user_id;

  -- Если у пользователя еще нет реферера
  IF v_current_referrer IS NULL THEN
    -- Пытаемся назначить отправителя подарка как реферера
    IF v_gift.from_user_id != p_user_id THEN
      UPDATE private_users
      SET referrer_id = v_gift.from_user_id
      WHERE id = p_user_id;

      v_new_level := 1;

      -- Добавляем запись в referral_tree
      INSERT INTO referral_tree (
        referrer_id,
        referred_id,
        level
      ) VALUES (
        v_gift.from_user_id,
        p_user_id,
        v_new_level
      );

      -- Помечаем, что подарок создал реферала
      UPDATE gifts
      SET status = CASE WHEN v_gift.status = 'claimed' THEN 'claimed'::GIFT_STATUS ELSE 'accepted'::GIFT_STATUS END,
          created_referral = true
      WHERE id = p_gift_id;

      RETURN QUERY SELECT true, 'Подарок принят, вы стали рефералом!'::TEXT, v_gift.from_user_id;
    ELSE
      RETURN QUERY SELECT false, 'Нельзя быть рефералом самому себе'::TEXT, NULL::UUID;
    END IF;
  ELSE
    -- У пользователя уже есть реферер, просто добавляем токены
    UPDATE gifts
    SET status = CASE WHEN v_gift.status = 'claimed' THEN 'claimed'::GIFT_STATUS ELSE 'accepted'::GIFT_STATUS END,
        created_referral = false
    WHERE id = p_gift_id;

    RETURN QUERY SELECT true, 'Подарок принят!'::TEXT, v_current_referrer;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================

-- 6. Функция для списания токенов (используется при генерации контента)
CREATE OR REPLACE FUNCTION deduct_tokens(
  p_user_id UUID,
  p_amount BIGINT
)
RETURNS TABLE(
  success BOOLEAN,
  new_balance BIGINT,
  message TEXT
) AS $$
DECLARE
  v_current_balance BIGINT;
BEGIN
  -- Получаем текущий баланс
  SELECT balance INTO v_current_balance
  FROM user_balances
  WHERE user_id = p_user_id;

  IF v_current_balance IS NULL THEN
    RETURN QUERY SELECT false, 0::BIGINT, 'Пользователь не найден'::TEXT;
    RETURN;
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN QUERY SELECT false, v_current_balance, 'Недостаточно токенов'::TEXT;
    RETURN;
  END IF;

  -- Списываем токены
  UPDATE user_balances
  SET balance = balance - p_amount
  WHERE user_id = p_user_id;

  v_current_balance := v_current_balance - p_amount;

  RETURN QUERY SELECT true, v_current_balance, 'Токены списаны успешно'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================

-- 7. Функция инициализации реферальных настроек для нового пользователя
CREATE OR REPLACE FUNCTION init_referral_settings(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO referral_settings (
    user_id,
    allow_referrer_referrals_registration
  ) VALUES (
    p_user_id,
    false
  );
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
