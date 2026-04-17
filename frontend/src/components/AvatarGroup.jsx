import React from 'react'

const AvatarGroup = ({avatars, maxVisible = 3}) => {
  return (
    <div className="flex items-center">
        {avatars.slice(0, maxVisible).map((avatar, index) => (
            <img
                key={index}
                src={avatar}
                alt={`Avatar ${index + 1}`}
                className="w-8 h-8 rounded-full border-2 border-white"
            />
        ))}
        {avatars.length > maxVisible && (
            <div className="w-8 h-8 rounded-full bg-gray-300 text-xs text-gray-600 flex items-center justify-center border-2 border-white">
                +{avatars.length - maxVisible}
            </div>
        )}
    </div>
  )
}

export default AvatarGroup