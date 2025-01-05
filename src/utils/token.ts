
export const generateToken = (length = 4) =>{
    // decallar variable 
    let otp = "";
    
    for(let i = 0; i < length; i++){
        const digit = Math.floor(Math.random() * 10)
        otp += digit
    }
    return otp;
}

export const generateOrderNumber = (): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const timestamp = Date.now().toString(36).toUpperCase(); // Base36 timestamp
    let randomPart = '';
  
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomPart += characters[randomIndex];
    }
  
    return `${timestamp}${randomPart}`.slice(-10); // Ensure 10 characters
  };
  
  const number = generateOrderNumber();
  console.log(number);
  
  

// export const generateOrderNumber = (length: number): string => {
//     const prefix = 'TAKE-OFF';
//     const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
//     let randomPart = ''; // Holds the random alphanumeric part
  
//     for (let i = 0; i < length; i++) {
//       const randomIndex = Math.floor(Math.random() * characters.length);
//       randomPart += characters[randomIndex];
//     }
  
//      return `${prefix}-${randomPart}`; // Combine prefix and random part wi th a hyphen
//   };

//   const number = generateOrderNumber(5)
//   console.log(number)
  //TAKE-OFF-ABC123