"use client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { CheckCircle, Smartphone, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const Approve = () => {
  const { data, isPending } = authClient.useSession();

  const router = useRouter();
  const searchParams = useSearchParams();
  const userCode = searchParams.get("user_code");

  const [isProcessing, setisProcessing] = useState({
    approved: false,
    deny: false,
  });

  useEffect(() => {
    if (!data?.session && !data?.user) {
      router.push("/sign-in");
    }
  }, []);

  if (!isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <Spinner />
      </div>
    );
  }

  const handleApprove = async () => {
    setisProcessing((prev) => ({ ...prev, approved: true }));
    try {
      toast.loading("Approving device...", { id: "loading" });
      if (userCode) {
        await authClient.device.approve({
          userCode: userCode,
        });
        toast.dismiss("loading");
        toast.success("Device approved successfully!");
        router.push("/");
      } else {
        toast.dismiss("loading");
        toast.error("Mssing usercode");
        return;
      }
    } catch (error) {
      toast.error("Failed to approve");
      console.error(error);
    } finally {
      setisProcessing((prev) => ({ ...prev, approved: false }));
    }
  };
  const handleDeny = async () => {
    setisProcessing((prev) => ({ ...prev, deny: true }));
    try {
      toast.loading("Denying device...", { id: "loading" });
      if (userCode) {
        await authClient.device.approve({
          userCode: userCode,
        });
        toast.dismiss("loading");
        toast.success("Device deny successfully!");
        router.push("/");
      } else {
        toast.dismiss("loading");
        toast.error("Mssing usercode");
        return;
      }
    } catch (error) {
      toast.error("Failed to deny");
      console.error(error);
    } finally {
      setisProcessing((prev) => ({ ...prev, deny: false }));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background font-sans">
      <div className="w-full max-w-md px-4">
        <div className="space-y-8">
          {/* Header Card */}
          <div className="border-2 border-dashed border-zinc-700 rounded-2xl p-8 bg-zinc-900/50 backdrop-blur-sm text-center">
            {/* Device Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-zinc-600 bg-zinc-800 flex items-center justify-center">
                  <Smartphone className="w-12 h-12 text-cyan-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full border-2 border-zinc-900 flex items-center justify-center">
                  <span className="text-xs text-white font-bold">!</span>
                </div>
              </div>
            </div>

            {/* Title and Description */}
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-zinc-50">
                Device Authorization
              </h1>
              <p className="text-sm text-zinc-400">
                A new device is requsting access to your account
              </p>
            </div>

            {/* Decice code Card */}
            <div className="border-2 border-dashed border-zinc-700 rounded-2xl p-6 bg-zinc-900/50 backdrop-blur-sm space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Authorization Code
                </p>
                <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                  <p className="text-xl font-mono font-bold text-cyan-400 text-center tracking-widest">
                    {userCode || "---"}
                  </p>
                </div>
                <p className="text-xs text-zinc-600 text-center">
                  Share this code with the requsting device
                </p>
              </div>
            </div>

            {/* Security info Card */}
            <div className="border-2 border-dashed border-zinc-700 rounded-2xl p-6 bg-zinc-900/50 backdrop-blur-sm">
              <div className="space-y-3">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Account: {data?.user?.email}
                </p>
                <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                  <p className="text-xs text-zinc-300">
                    Only approve this request if you initiated it. For Security,
                    never share this code with others.
                  </p>
                </div>
              </div>
            </div>

            {/* Action button */}
            <div className="space-y-3">
              <Button
                onClick={handleApprove}
                disabled={isProcessing.approved}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing.approved ? (
                  <>
                    <Spinner className="w-4 h-4" />
                    <span>Approving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Approve Device</span>
                  </>
                )}
              </Button>

              <Button
                onClick={handleDeny}
                disabled={isProcessing.deny}
                className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing.deny ? (
                  <>
                    <Spinner className="w-4 h-4" />
                    <span>Denying...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    <span>Deny Device</span>
                  </>
                )}
              </Button>
            </div>

            {/* Decorative divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px border-t border-dashed border-zinc-700"></div>
              <div className="text-xs text-zinc-600">Choose wisely</div>
              <div className="flex-1 h-px border-t border-dashed border-zinc-700"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Approve;
