"use client";

import { useState } from "react";

type Props = {
  defaultPlan: "free" | "pro" | "agency";
  defaultAccessUntil?: string;
};

export function CustomerAccessFields({ defaultPlan, defaultAccessUntil = "" }: Props) {
  const [plan, setPlan] = useState(defaultPlan);
  const [changeAccess, setChangeAccess] = useState(false);
  const requiresValidity = changeAccess && plan !== "free";

  return (
    <>
      <label className="text-xs text-muted-foreground">
        Plano para concessão administrativa
        <select
          name="planCode"
          value={plan}
          onChange={(event) => setPlan(event.target.value as Props["defaultPlan"])}
          className="mt-1 h-9 w-full border border-white/10 bg-background px-2 text-sm text-foreground"
        >
          <option value="free">Grátis</option>
          <option value="pro">Pro</option>
          <option value="agency">Agency</option>
        </select>
      </label>

      <label className="text-xs text-muted-foreground">
        Validade do acesso (horário de Brasília){requiresValidity ? " *" : ""}
        <input
          type="date"
          name="accessUntil"
          defaultValue={defaultAccessUntil}
          required={requiresValidity}
          aria-required={requiresValidity}
          className="mt-1 h-9 w-full border border-white/10 bg-background px-2"
        />
        {requiresValidity ? (
          <span className="mt-1 block text-[11px] text-amber-300">
            Informe a validade para conceder acesso Pro ou Agency.
          </span>
        ) : null}
      </label>

      <label className="flex gap-2 text-xs">
        <input
          type="checkbox"
          name="changeAccess"
          checked={changeAccess}
          onChange={(event) => setChangeAccess(event.target.checked)}
        />
        Aplicar alteração de acesso e validade
      </label>
    </>
  );
}
