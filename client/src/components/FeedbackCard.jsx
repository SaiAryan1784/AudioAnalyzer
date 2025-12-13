function FeedbackCard({ timestamp, principle, description, onSeek }) {
  return (
    <div className="bg-white shadow-sm border border-zinc-200 rounded-2xl p-6 hover:shadow-md hover:border-zinc-300 transition-all group">
      <div className="flex items-start gap-5">
        <button
          onClick={() => onSeek(timestamp)}
          className="px-4 py-2.5 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 active:scale-95 transition-all font-mono text-sm font-semibold flex-shrink-0 shadow-sm"
        >
          {timestamp}
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-zinc-900 mb-2 text-lg group-hover:text-zinc-800 transition-colors">{principle}</h3>
          <p className="text-zinc-600 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  )
}

export default FeedbackCard

