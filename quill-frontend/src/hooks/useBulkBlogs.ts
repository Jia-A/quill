import { API_URL } from "@/utils/constants"
import axios from "axios"
import useSWR from "swr"

// Fetcher function for SWR
const fetcher = async (url: string) => {
    console.log("Fetching data from:", url)
    const response = await axios.get(url)
    console.log(response)
    if (response.status === 200) {
        return response.data?.blogs
    } else {
        throw new Error("Can't fetch blogs right now!")
    }
}

// Hook for fetching bulk blogs with SWR
export const useBulkBlogs = () => {
    const { data, error, isLoading, mutate } = useSWR(
        `${API_URL}/blog/bulk`,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
        }
    )

    return {
        blogs: data,
        isLoading,
        error,
        mutate, // For manual revalidation
    }
}