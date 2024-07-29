export const extracTime = (iso)=>{
    const data = new Date(iso)
    const hours = data.getHours().toString().padStart(2,'0')
    const minutes = data.getMinutes().toString().padStart(2,'0')
    return `${hours}:${minutes}`
}