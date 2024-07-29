import React, { useContext, useState } from 'react'
import GenderCheckbox from './GenderCheckbox'
import { Link } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';
const SignUp = () => {

    const [loading,setLoading] = useState(false)
    const {setAuthUser} = useContext(AuthContext)
    const [inputs, setInputs] = useState({
        fullname:'',
        username:'',
        password:'',
        confirmPassword:'',
        gender:'',
    })
const handleCheckboxChange = (gender)=>{
    setInputs({...inputs,gender})
}

const handleInputError = ({fullname,username,password,confirmPassword,gender})=>{
    if(!fullname || !username || !password || !confirmPassword || !gender){
        toast.error('Please fill in all fields')
        return false
    }
    if(password !== confirmPassword){
        toast.error('Password do not match')
        return false
    }
    if(password.length<6){
        toast.error('Password must be at least 6 characters')
        return false
    }
    return true;
}

const handleSubmit = async(e)=>{
    e.preventDefault();
    const success = handleInputError(inputs)
    if(!success) return;
    setLoading(true)
    try {
        const res = await fetch('/auth/signup',{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(inputs)
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
            <Toaster />
        <div className='w-full p-6 rounded-lg shadow-md bg-gray-400 bg-clip-padding backdrop-filter 
        backdrop-blur-lg bg-opacity-0'>
            <h1 className='text-3xl font-semibold text-center text-gray-300'>
                SignUp
                <span className='text-blue-500'> ChatApp</span>
            </h1>
            <form onSubmit={handleSubmit} >
                <div>
                    <label className='label p-2'>
                        <span className='text-base label-text'>Full Name</span>
                    </label>
                    <input type="text" placeholder='Enter fullName' className='w-full input input-bordered  h-10' 
                        value={inputs.fullname}
                        onChange={e=>setInputs({...inputs,fullname:e.target.value})}
                    />

                </div>
                <div>
                    <label className='label p-2'>
                        <span className='text-base label-text'>Username</span>
                    </label>
                    <input type="text" placeholder='Enter username' className='w-full input input-bordered  h-10' 
                    value={inputs.username}
                    onChange={e=>setInputs({...inputs,username:e.target.value})}
                    />

                </div>
                <div>
                    <label className='label p-2'>
                        <span className='text-base label-text'>Password</span>
                    </label>
                    <input type="password" placeholder='Enter password' className='w-full input input-bordered  h-10' 
                    value={inputs.password}
                    onChange={e=>setInputs({...inputs,password:e.target.value})}
                    />

                </div>
                <div>
                    <label className='label p-2'>
                        <span className='text-base label-text'>Confirm password</span>
                    </label>
                    <input type="password" placeholder='Enter confirm password' className='w-full input input-bordered  h-10' 
                    value={inputs.confirmPassword}
                    onChange={e=>setInputs({...inputs,confirmPassword:e.target.value})}
                    />

                </div>
                <GenderCheckbox onCheckboxChange = {handleCheckboxChange} selectedGender = {inputs.gender}/>
                <Link to="/login" className='text-sm hover:underline hover:text-blue-600 mt-2 inline-block'>
                    Already have an account?
              </Link>
              <div>
                <button disabled={loading} className='btn btn-primary w-full mt-4'>{loading?<span className='loading loading-spinner'></span>:"Sign up"}</button>
              </div>
            </form>
        </div>
    </div>
  )
}

export default SignUp
