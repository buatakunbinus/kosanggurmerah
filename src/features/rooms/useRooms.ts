import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listRooms, createRoom, updateRoom, deleteRoom } from "./roomService";
import { setOccupantForMonth } from "./occupancyService";
import type { Room } from "../../types/models";

export function useRooms(currentMonth?: string) {
  const qc = useQueryClient();
  const roomsQuery = useQuery({ queryKey: ["rooms"], queryFn: listRooms });

  const createMut = useMutation({
    mutationFn: createRoom,
    onSuccess: async (room) => {
      if (currentMonth && room.tenant_name && room.status === "occupied") {
        try {
          await setOccupantForMonth(room.id, currentMonth, room.tenant_name);
        } catch (err) {
          // log but don't fail user flow; occupant snapshot is ancillary
          console.error("setOccupantForMonth failed (create)", err);
        }
      }
      qc.invalidateQueries({ queryKey: ["rooms"] });
      if (currentMonth)
        qc.invalidateQueries({ queryKey: ["occupants", currentMonth] });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Omit<Room, "id">>;
    }) => updateRoom(id, patch),
    onSuccess: async (room) => {
      if (currentMonth && room.tenant_name && room.status === "occupied") {
        try {
          await setOccupantForMonth(room.id, currentMonth, room.tenant_name);
        } catch (err) {
          console.error("setOccupantForMonth failed (update)", err);
        }
      }
      qc.invalidateQueries({ queryKey: ["rooms"] });
      if (currentMonth)
        qc.invalidateQueries({ queryKey: ["occupants", currentMonth] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteRoom,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rooms"] }),
  });

  return { roomsQuery, createMut, updateMut, deleteMut };
}
