const emojiGroups = [
  { name: 'Smileys', emojis: ['😀','😂','🥹','😍','🤩','😎','🤔','😅','😭','🥺','😤','🤯','😏','😴','🤗','🫠'] },
  { name: 'Gestures', emojis: ['👍','👎','👏','🙌','🤝','💪','🫶','✌️','🤞','👋','🫡','🤌','👆','👇','👈','👉'] },
  { name: 'Hearts', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','❣️','💕','💗','💖','💘','💝','♥️'] },
  { name: 'Objects', emojis: ['🔥','✨','🎉','🎊','💡','📸','🎵','⚡','🌟','💎','🏆','🚀','🎯','💰','📌','🔑'] },
]

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
}

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  return (
    <div className="bg-bg-primary border border-border rounded-xl shadow-lg p-3 w-[280px] max-h-[200px] overflow-y-auto">
      {emojiGroups.map((group) => (
        <div key={group.name} className="mb-2">
          <p className="text-xs text-text-tertiary mb-1">{group.name}</p>
          <div className="flex flex-wrap gap-1">
            {group.emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onSelect(emoji)}
                className="h-8 w-8 flex items-center justify-center rounded hover:bg-bg-tertiary text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
