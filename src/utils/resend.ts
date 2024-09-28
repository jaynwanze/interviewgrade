import { Resend } from "resend";


try {
    if (process.env.RESEND_API_KEY === undefined) {
        throw new Error("RESEND_API_KEY is not set");
    } else {
        console.log("RESEND_API_KEY is set");
    }
    const resend = new Resend(process.env.RESEND_API_KEY);
} catch (error) {
    console.error(error.message);
    // Handle error appropriately, e.g., fallback or exit
}

export const resend = new Resend(process.env.RESEND_API_KEY);  

///export const resendClient = new Resend(process.env.RESEND_API_KEY);
export const resendFrom = "InterviewGrade <noreply@app.interviewgrade.io>";