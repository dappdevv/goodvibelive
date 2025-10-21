import {
  Card,
  Container,
  Heading,
  Text,
  Code,
  Separator,
} from "@radix-ui/themes";

export default function DocsPage() {
  return (
    <Container size="3" className="py-10">
      <Card className="glass-card p-6">
        <Heading className="neon-text" size="6">
          Context7: OpenAI Chat Completions
        </Heading>
        <Separator my="4" size="4" />
        <Text size="3">Пример вызова:</Text>
        <Code
          variant="soft"
          style={{ display: "block", whiteSpace: "pre-wrap", marginTop: 8 }}
        >
          {`import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const completion = await client.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: 'Кратко и по делу.' },
    { role: 'user', content: 'Помоги распланировать задачи.' }
  ]
});

console.log(completion.choices[0]?.message?.content);`}
        </Code>
      </Card>
    </Container>
  );
}
