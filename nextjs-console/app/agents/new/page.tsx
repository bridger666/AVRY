'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreateAgentRequest, AgentProvider, AgentRuntime } from '@/types/agents';

const PROVIDERS: AgentProvider[] = ['openrouter', 'openai', 'anthropic', 'other'];
const RUNTIMES: AgentRuntime[] = ['zeroclaw', 'direct', 'n8n'];

export default function NewAgentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateAgentRequest>({
    name: '',
    description: '',
    model: 'claude-3-5-sonnet',
    provider: 'openrouter',
    runtime: 'zeroclaw',
    tags: [],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create agent');
      }

      const agent = await res.json();
      router.push(`/agents/${agent.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a18] to-[#2a2a26] p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/agents" className="text-[#00e59e] hover:text-[#00f5b0] text-sm font-medium mb-4 inline-block">
            ← Back to Agents
          </Link>
          <h1 className="text-3xl font-bold text-zinc-100">Create New Agent</h1>
          <p className="text-zinc-400 mt-2">Configure a new AI agent for your workflows</p>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Agent Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Customer Support Bot"
              required
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#00e59e] transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="What does this agent do?"
              rows={3}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#00e59e] transition-colors resize-none"
            />
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Model *
            </label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              placeholder="e.g., claude-3-5-sonnet"
              required
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#00e59e] transition-colors"
            />
          </div>

          {/* Provider */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Provider *
            </label>
            <select
              name="provider"
              value={formData.provider}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-zinc-100 focus:outline-none focus:border-[#00e59e] transition-colors"
            >
              {PROVIDERS.map(p => (
                <option key={p} value={p} className="bg-[#2a2a26]">
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Runtime */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Runtime
            </label>
            <select
              name="runtime"
              value={formData.runtime}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-zinc-100 focus:outline-none focus:border-[#00e59e] transition-colors"
            >
              {RUNTIMES.map(r => (
                <option key={r} value={r} className="bg-[#2a2a26]">
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#00e59e] text-black font-semibold rounded-lg hover:bg-[#00f5b0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Agent'}
            </button>
            <Link
              href="/agents"
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-zinc-300 font-semibold rounded-lg hover:bg-white/10 transition-colors text-center"
            >
              Cancel
            </Link>
          </div>
        </form>

        {/* Info box */}
        <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
          <p className="text-sm text-zinc-400">
            <strong className="text-zinc-300">Note:</strong> Agents start in "draft" status. You can activate them after creation and configure advanced settings like prompts and tools in future updates.
          </p>
        </div>
      </div>
    </div>
  );
}
