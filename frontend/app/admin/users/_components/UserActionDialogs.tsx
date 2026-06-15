import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShieldAlert, Trash2 } from "lucide-react";

interface UserActionDialogsProps {
  userToBan: string | null;
  setUserToBan: (id: string | null) => void;
  executeBan: () => void;
  userToDelete: string | null;
  setUserToDelete: (id: string | null) => void;
  executeDelete: () => void;
  userToUnban: string | null;
  setUserToUnban: (id: string | null) => void;
  executeUnban: () => void;
}

export const UserActionDialogs = ({
  userToBan,
  setUserToBan,
  executeBan,
  userToDelete,
  setUserToDelete,
  executeDelete,
  userToUnban,
  setUserToUnban,
  executeUnban,
}: UserActionDialogsProps) => {
  return (
    <>
      <AlertDialog
        open={!!userToBan}
        onOpenChange={(open) => !open && setUserToBan(null)}
      >
        <AlertDialogContent className="bg-[#050510] border border-red-900/50 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400 font-bold uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert size={18} /> Restrict Access?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-mono text-xs">
              Are you sure you want to ban this user? They will immediately lose
              access to the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border border-teal-900 text-teal-200 hover:bg-teal-900/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeBan}
              className="bg-red-500 hover:bg-red-600 text-black font-bold"
            >
              Confirm Ban
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!userToUnban}
        onOpenChange={(open) => !open && setUserToUnban(null)}
      >
        <AlertDialogContent className="bg-[#050510] border border-emerald-900/50 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert size={18} /> Restore Access?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-mono text-xs">
              This will restore the user's ability to log in and access the
              platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border border-teal-900 text-teal-200 hover:bg-teal-900/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeUnban}
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold"
            >
              Confirm Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent className="bg-[#050510] border border-red-900/50 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400 font-bold uppercase tracking-wider flex items-center gap-2">
              <Trash2 size={18} /> Delete Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-mono text-xs">
              This action cannot be undone. Checks related to this user (e.g.
              certificates) might break.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border border-teal-900 text-teal-200 hover:bg-teal-900/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              className="bg-red-500 hover:bg-red-600 text-black font-bold"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
