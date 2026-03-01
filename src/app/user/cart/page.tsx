'use client'
import { ArrowLeft, Minus, Plus, ShoppingBasket, Trash, Trash2 } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import {AnimatePresence, motion} from "motion/react"
import { useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/redux/store'
import { div } from 'motion/react-client'
import Image from 'next/image'
import { useDispatch } from 'react-redux'
import { decreaseQuantity, increaseQuantity, removeFromCart } from '@/redux/cartSlice'
import { useRouter } from 'next/navigation'

function CartPage() {
    const {cartData,subTotal,finalTotal,deliveryFee}=useSelector((state:RootState)=>state.cart)
    const dispatch=useDispatch<AppDispatch>()
    const router=useRouter()
  return (
    <div className='w-[95%] sm:w-[90%] md:w-[80%] mx-auto mt-8 mb-24 relative'>
      <Link href={"/"} className='absolute -top-2 left-0 flex items-center gap-2 text-green-700 hover:text-green-800 font-medium transition-all'>
         <ArrowLeft size={20}/>
         <span className='hidden sm:inline'>Back to home</span>
      </Link>
<motion.h2
initial={{opacity:0,y:10}}
animate={{opacity:1,y:0}}
transition={{duration:0.3}}
className='text-2xl sm:text-3xl md:text-4xl font-bold text-green-700 text-center mb-10'
>🛒 Your Shopping Cart</motion.h2>

{cartData.length==0 ? (
<motion.div
initial={{opacity:0,y:10}}
animate={{opacity:1,y:0}}
transition={{duration:0.3}}
className='text-center py-20 bg-white rounded-2xl shadow-md'
 >
  <ShoppingBasket className='w-16 h-16 text-gray-400 mx-auto mb-4'/>
  <p className='text-gray-600 text-lg mb-6'>Your Cart is empty. Add some groceries to continue shopping!</p> 
  <Link href={"/"} className='bg-green-600 text-white px-6 py-3 rounded-full hover:bg-green-700 transition-all inline-block font-medium'>Continue Shopping</Link> 

</motion.div>

):(
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
      <div className='lg:col-span-2 space-y-5'>
        <AnimatePresence>
            {cartData.map((item,index)=>(
                <motion.div
                key={index}
                initial={{opacity:0,y:30}}
                animate={{opacity:1,y:0}}
                exit={{opacity:0,y:-20}}
                className='flex flex-col sm:flex-row items-center bg-white rounded-2xl shadow-md p-5 hover:shadow-xl transition-all duration-300 border border-gray-100'
                >
                    <div className='relative w-28 h-28 sm:w-24 sm:h-24 md:w-28 md:h-28 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50'>
                        <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className='object-contain p-3 transition-transform duration-300 hover:scale-105'
                        />
                    </div>
                     <div className='mt-4 sm:mt-0 sm:ml-4 flex-1 text-center sm:text-left'>
                        <h3 className='text-base sm:text-lg font-semibold text-gray-800 line-clamp-1'>{item.name}</h3>
                        <p className='text-xs sm:text-sm text-gray-500'>{item.unit}</p>
                        <p className='text-green-700 font-bold mt-1 text-sm sm:text-base'>₹{Number(item.price)*item.quantity}</p>
                     </div>
                     <div className='flex items-center justify-center sm:justify-end gap-3 mt-3 sm:mt-0 bg-gray-50 px-3 py-2 rounded-full'>
                       <button className='bg-white p-1.5 rounded-full hover:bg-green-100 transition-all border border-gray-200' onClick={()=>dispatch(decreaseQuantity(item._id))}><Minus size={14} className='text-green-700'/></button>
                       <span className='font-semibold text-gray-800 w-6 text-center'>{item.quantity}</span>
                       <button className='bg-white p-1.5 rounded-full hover:bg-green-100 transition-all border border-gray-200' onClick={()=>dispatch(increaseQuantity(item._id))}><Plus size={14} className='text-green-700'/></button>
                     </div>
                     <button className='sm:ml-4 mt-3 sm:mt-0 text-red-500 hover:text-red-700 transition-all' onClick={()=>dispatch(removeFromCart(item._id))}><Trash2 size={18}/></button>
                </motion.div>
            ))}
        </AnimatePresence>
      </div>
      <motion.div initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} transition={{duration:0.3}} className='bg-white rounded-2xl shadow-xl p-6 h-fit sticky top-24 border border-gray-100 flex flex-col'>
<h2 className='text-lg sm:text-xl font-bold text-gray-800 mb-4'>Order Summary</h2>
<div className='space-y-3 text-gray-700 text-sm sm:text-base'>
    <div className='flex justify-between'>
        <span>Subtotal</span>
        <span className='text-green-700 font-semibold'>₹{subTotal}</span>
    </div>
    <div className='flex justify-between'>
        <span>Delivery Fee</span>
        <span className='text-green-700 font-semibold'>₹{deliveryFee}</span>
    </div>
    <hr className='my-3'/>
<div className='flex justify-between font-bold text-lg sm:text-xl'>
        <span>Final Total</span>
        <span className='text-green-700 font-semibold'>₹{finalTotal}</span>
    </div>
</div>
<motion.button whileTap={{scale:0.95}} className='w-full mt-6 bg-green-600 text-white py-3 rounded-full hover:bg-green-700 transition-all font-semibold text-sm sm:text-base' onClick={()=>router.push("/user/checkout")}>
    Proceed to Checkout
</motion.button>
      </motion.div>
    </div>
)}


    </div>

  )
}

export default CartPage
