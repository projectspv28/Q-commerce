import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface IGrocery {
    _id: string,
    name: string,
    category: string,
    price: string,
    unit: string,
    quantity:number,
    image: string,
    createdAt?: Date,
    updatedAt?: Date
}
interface ICartSlice{
   cartData:IGrocery[],
   subTotal:number,
   deliveryFee:number,
   finalTotal:number
}


const initialState:ICartSlice={
   cartData:[],
   subTotal:0,
   deliveryFee:40,
   finalTotal:40
}

const cartSlice=createSlice({
   name:"cart",
   initialState ,
   reducers:{
    addToCart:(state,action:PayloadAction<IGrocery>)=>{
       state.cartData.push(action.payload) 
       cartSlice.caseReducers.calculateTotals(state)
    },
    increaseQuantity:(state,action:PayloadAction<string>)=>{
        const item=state.cartData.find(i=>i._id==action.payload)
        if(item){
         item.quantity=item.quantity + 1
        }
         cartSlice.caseReducers.calculateTotals(state)
    }
    ,
    decreaseQuantity:(state,action:PayloadAction<string>)=>{
      const item=state.cartData.find(i=>i._id==action.payload)
  if(item?.quantity && item.quantity>1){
   item.quantity=item.quantity-1
  }else{
   state.cartData=state.cartData.filter(i=>i._id!==action.payload)
  }
 cartSlice.caseReducers.calculateTotals(state)
    },
    removeFromCart:(state,action:PayloadAction<string>)=>{
       state.cartData=state.cartData.filter(i=>i._id!==action.payload)
        cartSlice.caseReducers.calculateTotals(state)
    },
    calculateTotals:(state)=>{
      state.subTotal=state.cartData.reduce((sum,item)=>sum +Number(item.price)*item.quantity,0)
      state.deliveryFee=state.subTotal>100?0:40
      state.finalTotal=state.subTotal + state.deliveryFee
    }
   }
})

export const {addToCart,increaseQuantity,decreaseQuantity,removeFromCart}=cartSlice.actions
export default cartSlice.reducer
