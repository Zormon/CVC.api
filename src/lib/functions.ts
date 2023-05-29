function sleep(ms:number):Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function addDays(date:Date, days:number):Date {
    var result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }


export {
    sleep,
    addDays
}