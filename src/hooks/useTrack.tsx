import { useState } from "react";
import { type Gate } from "../db/database.ts";

export function useTrack() {
    const [startGate, setStartGate] = useState<Gate | null>(null);
    const [finishGate, setFinishGate] = useState<Gate | null>(null);

    return {startGate, finishGate, setStartGate, setFinishGate};
}