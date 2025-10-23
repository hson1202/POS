import React from 'react'
import { IoArrowBackOutline } from 'react-icons/io5'
import { useNavigate } from 'react-router-dom'

const BackButton = () => {

    const navigate = useNavigate();

  return (
    <button onClick={() => navigate(-1)} className='bg-[#025cca] p-1.5 md:p-2 text-lg md:text-xl font-bold rounded-full text-white hover:bg-[#0347a3] transition-colors'> 
        <IoArrowBackOutline />
    </button>
  )
}

export default BackButton