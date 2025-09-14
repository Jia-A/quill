'use client'
import { IS_SSR } from "@/utils/constants";
import { useEffect, useState } from "react";

export const useCustomer = () => {
    const [customer, setCustomer] = useState({
        id: "",
        name: "",
        email: "",
        avatar: ""
    });
    const [isLogin, setIsLogin] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(true)

    const customerData = !IS_SSR ? localStorage.getItem("customer") : null;

    useEffect(() => {
        if (customerData) {
            setCustomer(JSON.parse(customerData));
            setIsLogin(true)
        }
        setIsLoading(false)
    }, [customerData]);

    return {customer, isLogin, setIsLogin, isLoading};
}