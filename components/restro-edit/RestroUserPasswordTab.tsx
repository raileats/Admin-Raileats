"use client";

type Props = {
  form: any;
  setForm: any;
};

export default function RestroUserPasswordTab({
  form,
  setForm,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">

      {/* LOGIN MOBILE */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Restro Login Mobile
        </label>

        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={10}
          value={
            form?.RestroLoginMobile || ""
          }
          onChange={(e) => {

            // ✅ ONLY NUMBERS
            let value =
              e.target.value.replace(
                /\D/g,
                ""
              );

            // ✅ MAX 10 DIGITS
            value = value.slice(0, 10);

            setForm((prev: any) => ({
              ...prev,
              RestroLoginMobile:
                value,
            }));
          }}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Enter 10 digit mobile"
        />
      </div>

      {/* PASSWORD */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Restro Password
        </label>

        <input
          type="text"
          value={
            form?.RestroPassword || ""
          }
          onChange={(e) =>
            setForm((prev: any) => ({
              ...prev,
              RestroPassword:
                e.target.value,
            }))
          }
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Enter password"
        />
      </div>

      {/* HOLIDAY STATUS */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Holiday Status
        </label>

        <select
          value={
            form?.HolidayStatus ?? 0
          }
          onChange={(e) =>
            setForm((prev: any) => ({
              ...prev,
              HolidayStatus:
                Number(
                  e.target.value
                ),
            }))
          }
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value={0}>
            OFF
          </option>

          <option value={1}>
            ON
          </option>
        </select>
      </div>

      {/* MINIMUM ORDER */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Minimum Order Amount
        </label>

        <input
          type="number"
          value={
            form?.MinimumOrderAmount ||
            ""
          }
          onChange={(e) =>
            setForm((prev: any) => ({
              ...prev,
              MinimumOrderAmount:
                e.target.value,
            }))
          }
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Enter minimum order"
        />
      </div>

    </div>
  );
}
