import zod from 'zod';
export const signupSchema = zod.object({
    email: zod.string().email(),
    password: zod.string().min(6, 'Password must be at least 6 characters long'),
    name: zod.string().min(1, 'Name is required'),
})

export const signinSchema = zod.object({
    email: zod.string().email(),
    password: zod.string().min(6, 'Password must be at least 6 characters long'),
})