import React from "react";

const GroupAvatar = ({ participants }) => {
  const avatars = participants.slice(0, 3).map((p) => p.profilePic);

  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      {avatars.length === 1 && (
        <img
          src={avatars[0]}
          alt="avatar"
          className="w-full h-full rounded-full object-cover"
        />
      )}

      {avatars.length === 2 && (
        <div className="flex -space-x-3">
          {avatars.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`member-${i}`}
              className="w-8 h-8 rounded-full border-2 border-gray-900 object-cover"
            />
          ))}
        </div>
      )}

      {avatars.length >= 3 && (
        <div className="grid grid-cols-2 gap-0.5">
          {avatars.slice(0, 3).map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`member-${i}`}
              className="w-7 h-7 rounded-full border-2 border-gray-900 object-cover"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupAvatar;
