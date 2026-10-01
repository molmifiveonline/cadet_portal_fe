import React, { useState } from "react";
import { isDepartmentCompatible } from "../allocationUtils";
import {
  Field,
  brandedSelectTriggerClass,
  BrandedSelectContent,
  BrandedSelectItem,
  Th,
  Td,
} from "./AllocationPrimitives";
import {
  Select,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Button } from "../../../components/ui/button";

const VesselSlot = ({
  role,
  typeField,
  vesselField,
  statusField,
  form,
  setForm,
  types,
  vessels,
  department,
  otherVesselId,
  readOnly,
}) => {
  const [locationFilter, setLocationFilter] = useState("all-locations");
  const selected = vessels.find((item) => item.id === form[vesselField]);
  const compatibleVessels = vessels.filter(
    (item) =>
      item.status === "Active" &&
      isDepartmentCompatible(item.department, department) &&
      item.id !== otherVesselId,
  );
  const locations = [
    ...new Set(
      compatibleVessels
        .map((item) => item.location || item.reporting_port)
        .filter(Boolean),
    ),
  ].sort((left, right) => left.localeCompare(right));
  const filteredVessels = compatibleVessels.filter((item) => {
    const matchesType =
      !form[typeField] ||
      String(item.vessel_type_id) === String(form[typeField]);
    const matchesLocation =
      locationFilter === "all-locations" ||
      item.location === locationFilter ||
      item.reporting_port === locationFilter;
    return matchesType && matchesLocation;
  });
  const displayedVessels = readOnly
    ? selected
      ? [selected]
      : []
    : filteredVessels;

  const selectVessel = (vessel) => {
    if (readOnly) return;
    setForm({
      ...form,
      [typeField]: vessel.vessel_type_id,
      [vesselField]: vessel.id,
      [statusField]: ["Allocated", "Hold"].includes(form[statusField])
        ? form[statusField]
        : "Allocated",
    });
  };

  return (
    <div className="space-y-4 rounded-xl border border-[#3a5f9e]/25 p-4">
      <div>
        <h3 className="font-bold text-slate-900">{role} Vessel</h3>
        <p className="text-xs text-slate-500">
          {role === "Primary"
            ? "Main CTV vessel assignment"
            : "Alternative or additional vessel assignment"}
        </p>
      </div>
      {!readOnly && (
        <div className="grid gap-3 md:grid-cols-2 md:items-end">
          <Field label="Vessel Type">
            <Select
              value={form[typeField] || "all-vessel-types"}
              onValueChange={(value) =>
                setForm({
                  ...form,
                  [typeField]: value === "all-vessel-types" ? "" : value,
                  [vesselField]: "",
                  [statusField]: "Pending",
                })
              }
            >
              <SelectTrigger
                className={brandedSelectTriggerClass}
                aria-label={`${role} vessel type filter`}
              >
                <SelectValue />
              </SelectTrigger>
              <BrandedSelectContent>
                <BrandedSelectItem value="all-vessel-types">
                  All {department} + Both vessel types
                </BrandedSelectItem>
                {types.map((item) => (
                  <BrandedSelectItem key={item.id} value={String(item.id)}>
                    {item.name} ({item.department})
                  </BrandedSelectItem>
                ))}
              </BrandedSelectContent>
            </Select>
          </Field>
          <Field label="Location">
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger
                className={brandedSelectTriggerClass}
                aria-label="Filter vessels by location"
              >
                <SelectValue />
              </SelectTrigger>
              <BrandedSelectContent>
                <BrandedSelectItem value="all-locations">
                  All locations
                </BrandedSelectItem>
                {locations.map((location) => (
                  <BrandedSelectItem key={location} value={location}>
                    {location}
                  </BrandedSelectItem>
                ))}
              </BrandedSelectContent>
            </Select>
          </Field>
        </div>
      )}

      <div className="max-h-[350px] overflow-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[925px] table-fixed text-left text-xs">
          <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
            <tr>
              <Th className="w-12">
                <span className="sr-only">Select</span>
              </Th>
              <Th className="w-[150px]">Vessel Name</Th>
              <Th className="w-[135px]">Vessel Type</Th>
              <Th className="w-[130px]">Location</Th>
              <Th className="w-[105px]">Total Seats</Th>
              <Th className="w-[120px]">Voyage Ref</Th>
              <Th className="w-[135px]">Reporting Port</Th>
            </tr>
          </thead>
          <tbody>
            {displayedVessels.map((vessel) => {
              const isSelected = vessel.id === form[vesselField];
              const vesselType =
                types.find(
                  (item) => String(item.id) === String(vessel.vessel_type_id),
                )?.name ||
                vessel.vessel_type ||
                "—";
              return (
                <tr
                  key={vessel.id}
                  className={`border-t ${isSelected ? "bg-[#3a5f9e]/10" : "hover:bg-[#3a5f9e]/[0.03]"} ${!readOnly ? "cursor-pointer" : ""}`}
                  onClick={() => selectVessel(vessel)}
                >
                  <Td>
                    <input
                      type="radio"
                      name={`${role.toLowerCase()}-vessel`}
                      aria-label={`Select ${vessel.name}`}
                      checked={isSelected}
                      disabled={readOnly}
                      onChange={() => selectVessel(vessel)}
                      className="h-4 w-4 border-slate-300 text-[#3a5f9e] focus:ring-[#3a5f9e]/30"
                    />
                  </Td>
                  <Td className="font-semibold text-slate-900">
                    {vessel.name}
                  </Td>
                  <Td>{vesselType}</Td>
                  <Td>{vessel.location || "—"}</Td>
                  <Td>{vessel.total_seats ?? "—"}</Td>
                  <Td>{vessel.voyage_ref || "—"}</Td>
                  <Td>{vessel.reporting_port || "—"}</Td>
                </tr>
              );
            })}
            {!displayedVessels.length && (
              <tr>
                <td
                  colSpan={7}
                  className="p-8 text-center text-sm text-slate-500"
                >
                  {readOnly
                    ? "No vessel is assigned."
                    : `No active ${department} or Both-compatible vessels match these filters.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(240px,360px)_auto] sm:items-end">
        <Field label={`${role} allocation status`}>
          <Select
            disabled={readOnly}
            value={form[statusField]}
            onValueChange={(value) =>
              setForm({ ...form, [statusField]: value })
            }
          >
            <SelectTrigger
              className={brandedSelectTriggerClass}
              aria-label={`${role} allocation status`}
            >
              <SelectValue />
            </SelectTrigger>
            <BrandedSelectContent>
              {["Pending", "Allocated", "Hold", "Cancelled"].map((value) => (
                <BrandedSelectItem key={value} value={value}>
                  {value}
                </BrandedSelectItem>
              ))}
            </BrandedSelectContent>
          </Select>
        </Field>
        {!readOnly && selected && (
          <Button
            type="button"
            variant="ghost"
            className="w-fit text-[#3a5f9e] hover:bg-[#3a5f9e]/10 hover:text-[#325186]"
            onClick={() =>
              setForm({
                ...form,
                [vesselField]: "",
                [statusField]: "Pending",
              })
            }
          >
            Clear selected vessel
          </Button>
        )}
      </div>
    </div>
  );
};

export default VesselSlot;
