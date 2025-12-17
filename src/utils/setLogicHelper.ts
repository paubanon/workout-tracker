import { WorkoutSession, SetLog } from '../models';

// Consolidating the logic to mark a set as complete (including ghost values)
export const performSetUpdate = (
    session: WorkoutSession | null,
    setSession: (session: WorkoutSession) => void,
    setId: string,
    completed: boolean,
    additionalUpdates: any = {}
) => {
    if (!session) return;

    const set = session.sets.find(s => s.id === setId);
    if (!set) return;

    let updates: any = { completed, ...additionalUpdates };

    if (completed) {
        // Fill with defaults if empty (Ghost Logic)
        if (!set.loadKg && set.targetLoad) updates.loadKg = set.targetLoad;
        if (!set.reps && set.targetReps) updates.reps = parseFloat(set.targetReps) || 0;
        if (!set.timeSeconds && set.targetTime) updates.timeSeconds = set.targetTime;
        if (!set.distanceMeters && set.targetDistance) updates.distanceMeters = set.targetDistance;
        if (!set.romCm && set.targetRom) updates.romCm = parseFloat(set.targetRom) || 0;
        if (!set.tempo && set.targetTempo) updates.tempo = set.targetTempo;
    }

    const updatedSets = session.sets.map(s => s.id === setId ? { ...s, ...updates } : s);
    setSession({ ...session, sets: updatedSets });
};

interface ToggleSetCompleteParams {
    setId: string;
    currentCompleted: boolean;
    trackRpePreference: boolean;
    setPendingSetId: (id: string | null) => void;
    setCurrentRpe: (rpe: number) => void;
    setShowRpeModal: (show: boolean) => void;
    session: WorkoutSession | null;
    setSession: (session: WorkoutSession) => void;
}

export const toggleSetComplete = ({
    setId,
    currentCompleted,
    trackRpePreference,
    setPendingSetId,
    setCurrentRpe,
    setShowRpeModal,
    session,
    setSession
}: ToggleSetCompleteParams) => {
    if (!currentCompleted && trackRpePreference) {
        // Marking as complete and RPE tracking is ON -> Show Modal
        setPendingSetId(setId);
        setCurrentRpe(7); // Default suggestion
        setShowRpeModal(true);
    } else {
        // Normal toggle
        performSetUpdate(session, setSession, setId, !currentCompleted);
    }
};

interface HandleSaveRpeParams {
    pendingSetId: string | null;
    currentRpe: number;
    handleUpdateSet: (setId: string, field: keyof SetLog, value: any) => void;
    performSetUpdate: typeof performSetUpdate;
    setShowRpeModal: (show: boolean) => void;
    setPendingSetId: (id: string | null) => void;
    session: WorkoutSession | null;
    setSession: (session: WorkoutSession) => void;
}

export const handleSaveRpe = ({
    pendingSetId,
    currentRpe,
    handleUpdateSet,
    setShowRpeModal,
    setPendingSetId,
    session,
    setSession
}: HandleSaveRpeParams) => {
    if (pendingSetId) {
        // We can use handleUpdateSet or just performSetUpdate with additionalUpdates if we want
        // But the original code called handleUpdateSet THEN performSetUpdate.
        // Let's optimize: performSetUpdate can handle both if we look at the implementation.
        // It takes 'additionalUpdates'.

        // Original:
        // handleUpdateSet(pendingSetId, 'rpe', currentRpe); -> updates session
        // performSetUpdate(pendingSetId, true); -> updates session AGAIN

        // Better: do it in one go
        performSetUpdate(session, setSession, pendingSetId, true, { rpe: currentRpe });

        setShowRpeModal(false);
        setPendingSetId(null);
    }
};
