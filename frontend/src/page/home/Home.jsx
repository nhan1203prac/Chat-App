import React from 'react'
import Sidebar from '../../component/sidebar/Sidebar'
import MessageContainer from '../../component/messages/MessageContainer'

const Home = () => {
  return (
    <div className='flex w-full max-w-6xl h-[650px] rounded-xl overflow-hidden bg-gray-200 bg-clip-padding backdrop-blur-md bg-opacity-10 shadow-lg'>
      <Sidebar />
      <MessageContainer />
    </div>
  )
}

export default Home
