"use client"

import ChatMessage from '@/components/ChatMessage'
import styles from './page.module.css'

export default function TestChatPage() {
  const sampleMessages = [
    {
      role: 'user' as const,
      content: 'Can you show me a Python function to calculate fibonacci numbers?'
    },
    {
      role: 'assistant' as const,
      content: `Here's a Python function to calculate Fibonacci numbers:

\`\`\`python
def fibonacci(n):
    """Calculate the nth Fibonacci number."""
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    else:
        return fibonacci(n - 1) + fibonacci(n - 2)

# Example usage
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")
\`\`\`

This is a recursive implementation. You can also use inline code like \`fibonacci(5)\` in your text.

Here's a more efficient iterative version:

\`\`\`python
def fibonacci_iterative(n):
    """Calculate the nth Fibonacci number iteratively."""
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b
\`\`\`

And here's a JavaScript version:

\`\`\`javascript
function fibonacci(n) {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

console.log(fibonacci(10)); // 55
\`\`\`

All three implementations work, but the iterative versions are more efficient for larger values of n.`
    }
  ]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>ChatMessage Component Test</h1>
        <p>Testing code block rendering with syntax highlighting and copy buttons</p>
      </div>
      
      <div className={styles.chatContainer}>
        {sampleMessages.map((msg, idx) => (
          <ChatMessage
            key={idx}
            role={msg.role}
            content={msg.content}
          />
        ))}
      </div>
    </div>
  )
}
