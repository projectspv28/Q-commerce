import React from 'react'
import HeroSection from './HeroSection'
import CategorySlider from './CategorySlider'
import connectDb from '@/lib/db'
import Grocery, { IGrocery } from '@/models/grocery.model'
import GroceryItemCard from './GroceryItemCard'
import { scoreGroceries } from '@engines/ppi/ppiEngine'
import { getAvailabilityMap } from '@engines/inventory/inventoryEngine'

async function UserDashboard({groceryList}:{groceryList:IGrocery[]}) {
await connectDb()
const plainGrocery = JSON.parse(JSON.stringify(groceryList))
const availability = await getAvailabilityMap(plainGrocery.map((g:IGrocery)=>g._id?.toString()))
const ecoReady = scoreGroceries(plainGrocery).filter((g:any)=>!availability[g._id]?.soldOut)

  return (
    <>
      <HeroSection/>
      <CategorySlider/>
      <div className='w-[90%] md:w-[80%] mx-auto mt-10'>
        <h2 className='text-2xl md:text-3xl font-bold text-green-700 mb-6 text-center'>Popular Grocery Items</h2>
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6'> 
          {ecoReady.map((item:any,index:number)=>(
        <GroceryItemCard key={index} item={item}/>
      ))}
      </div>

      </div>
     
    </>
  )
}

export default UserDashboard
