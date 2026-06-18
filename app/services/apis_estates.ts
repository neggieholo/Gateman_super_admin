import { EstateDetailsResponse, EstatesDirectoryResponse } from "./types";

export async function getEstatesDashboard(): Promise<EstatesDirectoryResponse> {
  const res = await fetch("/api/master/estates/estates-directory", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("HTTP error polling multi-tenant organizational directory");
  }

  const data: EstatesDirectoryResponse = await res.json();
  console.log("Received estates organizational directory metrics:", data);
  return data;
}

export async function getEstateDetailsContext(
  estateId: string,
): Promise<EstateDetailsResponse> {
  const res = await fetch(`/api/master/estates/details`, {
    method: "POST", 
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ estateId }), 
  });

  if (!res.ok) {
    throw new Error(
      "HTTP error polling detailed estate operational parameters.",
    );
  }

  const data: EstateDetailsResponse = await res.json();
  console.log(
    `Received deep instrumentation dataset for structural node [${estateId}]:`,
    data,
  );
  return data;
}