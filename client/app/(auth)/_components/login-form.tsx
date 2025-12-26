"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

const LoginForm = () => {
  const [isLoading, setLoading] = useState(false);

  const router = useRouter();
 

  return (
    <div className="flex flex-col gap-6 justify-center items-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        {/* <Image src={"/logo.svg"} alt="Logo" height={500} width={500} /> */}
        <h1 className="text-6xl font-extrabold text-indigo-400">
          Welcome back!
        </h1>
        <p className="text-base font-medium text-zinc-400">
          Login to your account for allowing device flow
        </p>
      </div>
      <Card className="border-dashed border-2">
        <CardContent>
          <div className="grid gap-6">
            <div className="flex flex-col gap-4">
              <Button
                variant={"outline"}
                className="w-full h-full"
                type="button"
                onClick={() =>
                  authClient.signIn.social({
                    provider: "github",
                    callbackURL: "http://localhost:3000",
                  })
                }
              >
                {/* <Image
                  src="/github.svg"
                  alt="Github"
                  width={20}
                  height={20}
                  className="size-4 dark:invert"
                /> */}
                Continue With Github
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
