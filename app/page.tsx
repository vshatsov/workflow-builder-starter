"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { useAtomValue } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { WorkflowCanvas } from "@/components/workflow/workflow-canvas";
import { WorkflowToolbar } from "@/components/workflow/workflow-toolbar";
import { api, ApiError } from "@/lib/api-client";
import { authClient, useSession } from "@/lib/auth-client";
import {
  currentWorkflowIdAtom,
  type WorkflowNode,
  type WorkflowEdge,
} from "@/lib/workflow-store";
import exampleWorkflow from "../example-workflow.json";

const Home = () => {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const currentWorkflowId = useAtomValue(currentWorkflowIdAtom);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    if (isPending) return;

    initRef.current = true;

    const init = async () => {
      try {
        // Sign in anonymously if no session
        if (!session) {
          console.log("Signing in anonymously...");
          const result = await authClient.signIn.anonymous();
          if (result.error) {
            console.error("Sign-in failed:", result.error);
            setError("Sign-in failed. Refresh to try again.");
            setIsInitializing(false);
            return;
          }
          // Wait for cookies
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Get workflows
        let workflows = await api.workflow.getAll();

        // Retry once if empty (session propagation)
        if (workflows.length === 0) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          workflows = await api.workflow.getAll();
        }

        if (workflows.length === 0) {
          // Seed Hello Workflow on first visit
          console.log("Seeding Hello Workflow...");

          const helloWorkflow = await api.workflow.create({
            name: "Hello Workflow",
            description: "Your first workflow",
            nodes: exampleWorkflow.nodes as WorkflowNode[],
            edges: exampleWorkflow.edges as WorkflowEdge[],
          });

          router.replace(`/workflows/${helloWorkflow.id}`);
        } else {
          const mostRecent = workflows.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )[0];
          router.replace(`/workflows/${mostRecent.id}`);
        }
      } catch (err) {
        console.error("Init failed:", err);
        if (err instanceof ApiError && err.status === 401) {
          window.location.reload();
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to initialize");
        setIsInitializing(false);
      }
    };

    init();
  }, [session, isPending, router]);

  if (isInitializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <p className="text-destructive">{error}</p>
          <button onClick={() => window.location.reload()} className="text-primary underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      <main className="relative flex size-full overflow-hidden">
        <ReactFlowProvider>
          <div className="relative flex-1 overflow-hidden">
            <WorkflowToolbar workflowId={currentWorkflowId ?? undefined} />
            <WorkflowCanvas />
          </div>
        </ReactFlowProvider>
      </main>
    </div>
  );
};

export default Home;
