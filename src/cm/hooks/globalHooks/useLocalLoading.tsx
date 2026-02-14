import Loader from '@cm/components/utils/loader/Loader'
import React, {useState} from 'react'

export default function useLocalLoading() {
  const [localLoading, setlocalLoading] = useState(false)
  const toggleLocalLoading = async cb => {
    setlocalLoading(true)
    const res = await cb()
    setlocalLoading(false)
    return res
  }

  const LocalLoader = () => {
    return (
      <div>
        {localLoading && (
          <Loader>
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-purple-400 rounded-full animate-spin animation-delay-150"></div>
              </div>
              <div className={` flex`}>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-700 mb-2">読み込み中...</div>
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce animation-delay-100"></div>
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce animation-delay-200"></div>
                </div>
              </div>
            </div>
          </Loader>
        )}
      </div>
    )
  }

  return {
    LocalLoader,
    toggleLocalLoading,
  }
}
