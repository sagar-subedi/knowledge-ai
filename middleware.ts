import { auth } from "@/auth";

export default auth((req) => {
    // req.auth contains the session
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
