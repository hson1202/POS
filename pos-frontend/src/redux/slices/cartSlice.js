import { createSlice } from "@reduxjs/toolkit";

const initialState = [];

const cartSlice = createSlice({
    name : "cart",
    initialState,
    reducers : {
        addItems : (state, action) => {
            const newItem = action.payload;
            const existingItemIndex = state.findIndex(item => item.id === newItem.id);
            
            if (existingItemIndex !== -1) {
                // Item đã tồn tại, cộng thêm quantity
                state[existingItemIndex].quantity += newItem.quantity;
                state[existingItemIndex].price = newItem.pricePerQuantity * state[existingItemIndex].quantity;
            } else {
                // Item mới, thêm vào cart
                state.push(newItem);
            }
        },

        removeItem: (state, action) => {
            return state.filter(item => item.id != action.payload);
        },

        removeAllItems: (state) => {
            return [];
        },

        updateQuantity: (state, action) => {
            const { id, quantity } = action.payload;
            const itemIndex = state.findIndex(item => item.id === id);
            
            if (itemIndex !== -1) {
                if (quantity <= 0) {
                    // Remove item if quantity is 0 or negative
                    state.splice(itemIndex, 1);
                } else {
                    // Update quantity and recalculate price
                    state[itemIndex].quantity = quantity;
                    state[itemIndex].price = state[itemIndex].pricePerQuantity * quantity;
                }
            }
        },

        updateItemNote: (state, action) => {
            const { id, note } = action.payload;
            const itemIndex = state.findIndex(item => item.id === id);
            
            if (itemIndex !== -1) {
                state[itemIndex].note = note;
            }
        }
    }
})

export const getTotalPrice = (state) => state.cart.reduce((total, item) => total + (item.price || 0), 0);
export const { addItems, removeItem, removeAllItems, updateQuantity, updateItemNote } = cartSlice.actions;
export default cartSlice.reducer;