import { useContext, useState } from "react";
import { BiLogOut } from "react-icons/bi";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";
const LogoutButton = () => {
  const [loading,setLoading] = useState(false)
  const {setAuthUser} = useContext(AuthContext)

  const handleLogout = async(e)=>{
    setLoading(true)
    try {
      const res = await fetch("/auth/logout",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
      })
      const data = await res.json();
      if(data.error){
        throw new Error(data.error)

      }
      localStorage.removeItem("chat-user")
      setAuthUser(null)

    } catch (error) {
      toast.error(error.message)
    }
    finally{
      setLoading(false)
    }
  }
  return (
    <div className='mt-auto'>
      {!loading?(
        <BiLogOut onClick={handleLogout} className="w-6 h-6 text-white cursor-pointer"/>

      ):
      <span className="loading loading-spinner"></span>
      }
    </div>
  )
}

export default LogoutButton
