import Button from "@/components/Button";
import { useFormStatus } from "react-dom";

export const SubmitButton = () => {
  const state = useFormStatus();

  return (
    <Button color="blue" disabled={state.pending}>
      {state.pending ? "...submit" : "register"}
    </Button>
  );
};
