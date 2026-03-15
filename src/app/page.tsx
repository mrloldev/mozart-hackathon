"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import AppShell from "@/components/app-shell";
import HomeView from "@/components/home-view";
import JoinRoomModal from "@/components/join-room-modal";
import RulesModal from "@/components/rules-modal";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [rulesModalOpen, setRulesModalOpen] = useState(false);

  const songCount = useQuery(api.songs.getCount);
  const liveRooms = useQuery(api.rooms.getLiveRooms);

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const codeFromUrl = params.get("code")?.toUpperCase().trim().slice(0, 6) ?? "";
    if (codeFromUrl.length === 6) {
      router.replace(`/join?code=${codeFromUrl}`);
    }
  }, [router]);

  return (
    <AppShell showFooter>
      <main className="flex flex-1 flex-col">
        <HomeView
          songCount={songCount ?? 0}
          liveRooms={liveRooms ?? []}
          onCreateTeam={() => router.push("/create")}
          onJoinRoom={() => setJoinModalOpen(true)}
          onLocalPlay={() => router.push("/local")}
          onOpenRules={() => setRulesModalOpen(true)}
        />
      </main>

      {rulesModalOpen && <RulesModal onClose={() => setRulesModalOpen(false)} />}

      {joinModalOpen && (
        <JoinRoomModal
          code={joinCode}
          setCode={setJoinCode}
          onClose={() => setJoinModalOpen(false)}
          onNext={() => {
            setJoinModalOpen(false);
            router.push(`/join?code=${joinCode.toUpperCase()}`);
          }}
        />
      )}
    </AppShell>
  );
}
