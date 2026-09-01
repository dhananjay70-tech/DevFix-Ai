import React from 'react'
import { SparklesIcon } from '../Icons'
import { useAssistant } from '../../context/AssistantContext'

export default function ExplainButton({
  title,
  data,
  type = 'metric',
  label = 'Explain',
  className = '',
  size = 'sm'
}) {
  const { explainItem } = useAssistant()

  const handleClick = (e) => {
    e.stopPropagation()
    explainItem({ title, data, type })
  }

  return (
    <button
      className={`btn-explain-ai size-${size} ${className}`}
      onClick={handleClick}
      type="button"
      title={`Ask AI to explain ${title}`}
    >
      <SparklesIcon className="w-3 h-3 text-indigo-400" />
      <span>{label}</span>
    </button>
  )
}
