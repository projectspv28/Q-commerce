
import { NextRequest, NextResponse } from "next/server"
import { auth } from "./auth"

export async function proxy(req:NextRequest){

    const {pathname}=req.nextUrl
   
    const publicRoutes=["/login","/register","/api/auth","/unauthorized"]
     if(publicRoutes.some((path)=>pathname.startsWith(path))){
        return NextResponse.next()
     }
const session=await auth()

if(!session){
  const loginUrl=new URL("/login",req.url)
   loginUrl.searchParams.set("callbackUrl",req.url)
   return NextResponse.redirect(loginUrl)
}

const role=session.user?.role
if(pathname.startsWith("/user") && role!=="user"){
  return NextResponse.redirect(new URL("/unauthorized",req.url))
}
if(pathname.startsWith("/delivery") && role!=="deliveryBoy"){
  return NextResponse.redirect(new URL("/unauthorized",req.url))
}
if(pathname.startsWith("/admin") && role!=="admin"){
  return NextResponse.redirect(new URL("/unauthorized",req.url))
}


return NextResponse.next()

}

export const config = {
  matcher:'/((?!api|_next/static|_next/image|favicon.ico).*)',
}


// req------middleware------server