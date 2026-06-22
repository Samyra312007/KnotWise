"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Biodata, Stage } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BiodataCard } from "@/components/biodata-card";
import { NotesFeed } from "@/components/notes-feed";
import { StageDropdown } from "@/components/stage-dropdown";
import { MatchesTab } from "./matches-tab";

interface MarginaliaNote {
  id: string;
  body: string;
  createdAt: string;
  date: string;
  matchmakerName: string;
}

export function CustomerDetail({
  id,
  stage,
  age,
  biodata,
  photoUrl,
  matchmakerName,
  marginalia,
}: {
  id: string;
  stage: Stage;
  age: number;
  biodata: Biodata;
  photoUrl?: string;
  matchmakerName: string;
  marginalia: MarginaliaNote[];
}) {
  const [tab, setTab] = React.useState("biodata");

  return (
    <section className="py-12 md:py-16">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute hover:text-ink-warm transition-colors mb-12 cursor-pointer"
      >
        <ArrowLeft size={12} />
        Back to my customers
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr_280px] gap-8 lg:gap-12 items-start">
        <div className="anim-reveal">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt=""
              className="w-full max-w-[200px] aspect-[3/4] object-cover border-r border-ink/24"
            />
          ) : (
            <div className="w-full max-w-[200px] aspect-[3/4] bg-paper-quiet border-r border-ink/24" />
          )}
        </div>

        <div className="min-w-0 anim-reveal anim-delay-1">
          <h1 className="font-display text-display-l text-ink leading-[0.95]">
            {biodata.firstName} {biodata.lastName}
          </h1>
          <div className="mt-4 text-[14px] text-ink-warm">
            <span className="font-mono tabular-nums">{age}</span>
            <span aria-hidden className="text-ink-mute/60 mx-2">—</span>
            <span>{biodata.city}, {biodata.country}</span>
            <span aria-hidden className="text-ink-mute/60 mx-2">—</span>
            <span>{biodata.designation} at {biodata.currentCompany}</span>
          </div>
          <div className="hairline mt-8" />
        </div>

        <aside className="anim-reveal anim-delay-2">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute mb-3">
            Current stage
          </div>
          <StageDropdown customerId={id} initialStage={stage} />

          {marginalia.length > 0 && (
            <>
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute mt-10 mb-4">
                Marginalia
              </div>
              <ul className="space-y-4 border-l border-vermilion/60 pl-4">
                {marginalia.map((n) => (
                  <li key={n.id} className="">
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute mb-1">
                      {n.date}
                    </div>
                    <div className="text-[13px] italic text-ink-warm leading-relaxed line-clamp-3">
                      {n.body}
                    </div>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setTab("notes")}
                className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute hover:text-vermilion cursor-pointer"
              >
                View all notes →
              </button>
            </>
          )}
        </aside>
      </div>

      <div className="mt-12 anim-reveal anim-delay-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="biodata">Biodata</TabsTrigger>
            <TabsTrigger value="matches">Suggested matches</TabsTrigger>
            <TabsTrigger value="notes">Notes &amp; history</TabsTrigger>
          </TabsList>

          <TabsContent value="biodata" className="mt-8">
            <BiodataCard biodata={biodata} />
          </TabsContent>

          <TabsContent value="matches" className="mt-12">
            <MatchesTab
              customerId={id}
              customerFirstName={biodata.firstName}
              clientGender={biodata.gender}
            />
          </TabsContent>

          <TabsContent value="notes" className="mt-12 pb-24">
            <NotesFeed customerId={id} matchmakerName={matchmakerName} />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
