import { useMemo } from "react"
import { Navigate, RouterProvider, createBrowserRouter } from "react-router"

import { getDefaultLessonSlug } from "@/domains/lessons/loaders"
import { LessonRoute } from "@/app/routes/lesson-route"

function buildDefaultLessonRedirect() {
  return <Navigate to={`/lessons/${getDefaultLessonSlug()}`} replace />
}

export function AppRouter() {
  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          path: "/",
          element: buildDefaultLessonRedirect(),
        },
        {
          path: "/lessons/:slug",
          element: <LessonRoute />,
        },
        {
          path: "*",
          element: buildDefaultLessonRedirect(),
        },
      ]),
    []
  )

  return <RouterProvider router={router} />
}
