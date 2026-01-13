import React from 'react'

const TopBanner: React.FC = () => {
  return (
    <div className="w-full bg-gray-900 text-gray-100 text-sm">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <span className="font-medium">PDF拆分合并工具</span>
        <span className="opacity-80">by 海边的飞行器</span>
      </div>
    </div>
  )
}

export default TopBanner
