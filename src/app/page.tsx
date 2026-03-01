import { auth } from '@/auth'
import AdminDashboard from '@/components/AdminDashboard'
import DeliveryBoy from '@/components/DeliveryBoy'
import EditRoleMobile from '@/components/EditRoleMobile'
import Footer from '@/components/Footer'
import GeoUpdater from '@/components/GeoUpdater'

import Nav from '@/components/Nav'
import UserDashboard from '@/components/UserDashboard'
import connectDb from '@/lib/db'
import Grocery, { IGrocery } from '@/models/grocery.model'

import User from '@/models/user.model'

import { redirect } from 'next/navigation'



async function Home(props:{
  searchParams:Promise<{
    q:string
  }>
}) {

const searchParams=await props.searchParams

  await connectDb()
  const session = await auth()
  if (!session) redirect("/login")
  console.log(session?.user)
  const user = await User.findById(session?.user?.id)
 if (!user) redirect("/login")

  const inComplete = !user.mobile || !user.role || (!user.mobile && user.role == "user")
  if (inComplete) {
    return <EditRoleMobile />
  }

  const plainUser = JSON.parse(JSON.stringify(user))

let groceryList:IGrocery[]=[]

if(user.role==="user"){
  if(searchParams.q){
    groceryList=await Grocery.find({
     $or:[
      { name: { $regex: searchParams?.q || "", $options: "i" } },
    { category: { $regex: searchParams?.q || "", $options: "i" } },
     ]
    })
  }else{
    groceryList=await Grocery.find({})
     

  }
}



  return (
    <>
      <Nav user={plainUser} />
      <GeoUpdater userId={plainUser._id}/>
      {user.role == "user" ? (
        <UserDashboard groceryList={groceryList}/>
      ) : user.role == "admin" ? (
        <AdminDashboard />
      ) : <DeliveryBoy />}
      <Footer/>
    </>
  )
}

export default Home
