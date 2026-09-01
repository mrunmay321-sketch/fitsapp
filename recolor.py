#!/usr/bin/env python3
import os

ROOT = '/tmp/cc-agent/70494354/project/src'

FILES = [
    'index.css',
    'components/MobileFrame.tsx',
    'components/Modal.tsx',
    'components/SectionHeader.tsx',
    'screens/BodyMatrix.tsx',
    'screens/BuyRecommendations.tsx',
    'screens/DigitalCloset.tsx',
    'screens/HomeDashboard.tsx',
    'screens/Settings.tsx',
    'screens/StoreScanner.tsx',
]

REPLACEMENTS = [
    ('bg-zinc-900/90', 'bg-[#FAF8F5]/90'),
    ('bg-zinc-900/95', 'bg-[#FAF8F5]/95'),
    ('bg-zinc-900/70', 'bg-[#EDE9E3]/70'),
    ('bg-zinc-900/60', 'bg-[#EDE9E3]/60'),
    ('bg-zinc-900/50', 'bg-[#EDE9E3]/50'),
    ('bg-zinc-900/40', 'bg-[#EDE9E3]/40'),
    ('bg-zinc-900/30', 'bg-[#EDE9E3]/30'),
    ('bg-zinc-900', 'bg-[#EDE9E3]'),
    ('bg-zinc-950', 'bg-[#FAF8F5]'),
    ('bg-black', 'bg-[#F5F2EE]'),
    ('bg-zinc-800/80', 'bg-[#D6D0C8]/80'),
    ('bg-zinc-800/60', 'bg-[#D6D0C8]/60'),
    ('bg-zinc-800', 'bg-[#D6D0C8]'),
    ('border-zinc-800/80', 'border-[#D6D0C8]/80'),
    ('border-zinc-800/60', 'border-[#D6D0C8]/60'),
    ('border-zinc-800', 'border-[#D6D0C8]'),
    ('border-zinc-700/60', 'border-[#C4BDB3]/60'),
    ('border-zinc-700/50', 'border-[#C4BDB3]/50'),
    ('border-zinc-700', 'border-[#C4BDB3]'),
    ('text-zinc-100', 'text-stone-800'),
    ('text-white', 'text-stone-800'),
    ('text-zinc-300', 'text-stone-600'),
    ('text-zinc-400', 'text-stone-500'),
    ('text-zinc-500', 'text-stone-400'),
    ('text-zinc-600', 'text-stone-400'),
    ('text-zinc-200', 'text-stone-700'),
    ('cyan-400', 'stone-600'),
    ('cyan-300', 'stone-500'),
    ('cyan-500', 'stone-700'),
    ('cyan-600', 'stone-700'),
    ('blue-600', 'stone-500'),
    ('blue-700', 'stone-600'),
    ('blue-500', 'stone-500'),
    ('shadow-cyan-500/10', 'shadow-stone-400/20'),
    ('shadow-cyan-500/5', 'shadow-stone-400/10'),
    ('shadow-cyan-500/20', 'shadow-stone-400/20'),
    ('shadow-cyan-500/40', 'shadow-stone-400/30'),
    ('shadow-cyan-500/15', 'shadow-stone-400/15'),
    ('ring-cyan-500/20', 'ring-stone-400/30'),
    ('focus:border-cyan-500/60', 'focus:border-stone-500/60'),
    ('focus:shadow-[0_0_0_3px_rgba(34,211,238,0.1)]', 'focus:shadow-[0_0_0_3px_rgba(120,113,108,0.15)]'),
    ('rgba(34,211,238,', 'rgba(120,113,108,'),
    ('from-cyan-500/20', 'from-stone-600/20'),
    ('to-blue-600/20', 'to-stone-500/20'),
    ('from-cyan-500/10', 'from-stone-600/10'),
    ('to-blue-600/5', 'to-stone-500/5'),
    ('from-cyan-500/15', 'from-stone-600/15'),
    ('from-cyan-500', 'from-stone-600'),
    ('to-cyan-400', 'to-stone-500'),
    ('from-emerald-500', 'from-emerald-600'),
    ('to-emerald-400', 'to-emerald-500'),
]

for rel in FILES:
    path = os.path.join(ROOT, rel)
    with open(path, 'r') as f:
        content = f.read()
    original = content
    for old, new in REPLACEMENTS:
        content = content.replace(old, new)
    if content != original:
        with open(path, 'w') as f:
            f.write(content)
        print(f'Updated: {rel}')
    else:
        print(f'No change: {rel}')

print('Done!')
