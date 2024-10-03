export const calculateTotalPrice = (totalCartPrice, withPriority, selectedOffer) => {
    const priorityPrice = withPriority ? totalCartPrice * 0.2 : 0;
    const offerDiscount = selectedOffer 
      ? (totalCartPrice * (Number(selectedOffer.discountPercentage) || 0) / 100) 
      : 0;
    
    const totalPrice = totalCartPrice + priorityPrice - offerDiscount;
  
    return { totalPrice, offerDiscount };
  };
  