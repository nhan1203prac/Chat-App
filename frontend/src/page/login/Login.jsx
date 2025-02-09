import React, { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import toast, { Toaster } from 'react-hot-toast'

const Login = () => {
  const [username,setUsername] = useState('')
  const [password,setPassword] = useState('')
  const [loading,setLoading] = useState(false)
  const {setAuthUser} = useContext(AuthContext)


  const handleInputError = ({username,password})=>{
    if(!username || !password){
      toast.error("Please fill in all fields")
      return false
    }
    return true;
  }
  const handleLogin = async(e)=>{
    e.preventDefault()
    const success = handleInputError({username,password})
    if(!success) return;
    setLoading(true)
    try {
      const res = await fetch('/auth/login',{
        method:'POST',
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({username,password})
      })
      const data = await res.json()
      if(data.error)
        throw new Error(data.error)
      localStorage.setItem("chat-user",JSON.stringify(data))
      setAuthUser(data)
    } catch (error) {
      toast.error(error.message)
    }finally{
      setLoading(false)
    }
  }
  return (
    <div className='flex flex-col items-center justify-center min-w-96 mx-auto'>
        <Toaster/>
        <div className='w-full p-6 rounded-lg shadow-md bg-gray-400 bg-clip-padding backdrop-filter 
        backdrop-blur-lg bg-opacity-0'>
            <h1 className='text-3xl font-semibold text-center text-gray-300'>
                Login
                <span className='text-blue-500'> ChatApp</span>
            </h1>
            <form onSubmit={handleLogin} >
              <div>
                  <label className='label p-2'>
                      <span className='text-base label-text'>Username</span>
                  </label>
                  <input type="text" placeholder='Enter username' className='w-full input input-bordered  h-10' onChange={e=>setUsername(e.target.value)} value={username} />
              </div>
              <div>
                  <label className='label'>
                      <span className='text-base label-text'>Password</span>
                  </label>
                  <input type="password" placeholder='Enter password' className='w-full  input input-bordered h-10' onChange={e=>setPassword(e.target.value)} value={password} />
              </div>
              <Link to="/signup" className='text-sm hover:underline hover:text-blue-600 mt-2 inline-block'>
                    Don't have an account?
              </Link>
              <div>
                <button className='btn btn-primary w-full mt-4' disabled={loading}>{loading?<span className='loading loading-spinner'></span>:"Login"}</button>
              </div>
            </form>
        </div>
    </div>
  )
}

export default Login
