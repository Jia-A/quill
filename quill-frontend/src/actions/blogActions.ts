import { API_URL } from "@/utils/constants"
import axios from "axios"


// Keep the original function for backward compatibility if needed
export const getBulkBlogs = async () => {
    const response = await axios.get(`${API_URL}/blog/bulk`)
    console.log(response)
    if (response.status === 200) {
        return response.data
    } else {
        throw new Error("Can't fetch blogs right now!")
    }
}