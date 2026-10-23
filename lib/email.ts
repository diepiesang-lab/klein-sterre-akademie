type BookingConfirmation = { to:string; parentName:string; date:string; time:string };
export async function sendBookingConfirmation({to,parentName,date,time}:BookingConfirmation):Promise<boolean>{
  const apiKey=process.env.RESEND_API_KEY,from=process.env.BOOKING_FROM_EMAIL;
  if(!apiKey||!from)return false;
  const response=await fetch("https://api.resend.com/emails",{
    method:"POST",
    headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},
    body:JSON.stringify({
      from,to:[to],subject:"Jou bespreking is bevestig • Klein Sterre Akademie",
      text:"Hallo "+parentName+",\n\nJou krieketsessie by Klein Sterre Akademie is bevestig.\n\nDatum: "+date+"\nTyd: "+time+"\n\nOns sien jou op die veld!\nKlein Sterre Akademie"
    })
  });
  if(!response.ok){console.error("Booking confirmation email failed with status",response.status);return false;}
  return true;
}