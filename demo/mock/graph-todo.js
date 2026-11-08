// Graph: Microsoft To Do (listeler, görevler, adımlar) ve Planner (boş).
import { addDays, startOfDay } from "../time.js"
import { toGraphList, toGraphTask } from "../state.js"
import { json, graphError, uid } from "./util.js"
import { CTX, decode, paged } from "./graph-util.js"

const empty = () => new Response(null, { status: 204 })

/** "YYYY-MM-DDT00:00:00.0000000" → yerel gün başı. */
const dayFrom = (dt) => {
  const [y, m, d] = String(dt).slice(0, 10).split("-").map(Number)
  return new Date(y, m - 1, d)
}

function applyTaskPatch(t, body) {
  if (!body) return
  if ("title" in body) t.title = body.title
  if ("importance" in body) t.importance = body.importance
  if ("status" in body) {
    t.status = body.status
    t.completed = body.status === "completed" ? new Date() : null
  }
  if ("dueDateTime" in body) t.due = body.dueDateTime ? dayFrom(body.dueDateTime.dateTime) : null
  if (body.body?.content != null) t.note = body.body.content
  t.modified = new Date()
}

function filterTasks(url, tasks) {
  const f = url.searchParams.get("$filter") ?? ""
  let rows = tasks
  if (/status ne 'completed'/i.test(f)) rows = rows.filter((t) => t.status !== "completed")
  else if (/status eq 'completed'/i.test(f)) rows = rows.filter((t) => t.status === "completed")
  if (/lastModifiedDateTime desc/i.test(url.searchParams.get("$orderby") ?? "")) {
    rows = [...rows].sort((a, b) => b.modified - a.modified)
  }
  return rows
}

export function handleTodo({ url, method, body, path, gs }) {
  const lists = gs.lists
  let m

  if (path === "/me/planner/tasks") return json({ value: [] })

  // ───── listeler ─────
  if (path === "/me/todo/lists") {
    if (method === "GET") return paged(url, lists, toGraphList)
    if (method === "POST") {
      const list = {
        id: `AQMkADdemoList${uid("l").replace(/[^a-z0-9]/gi, "")}`,
        displayName: body?.displayName ?? "Yeni liste",
        wellknownListName: "none",
        isOwner: true,
        isShared: false,
        tasks: [],
      }
      lists.push(list)
      return json(toGraphList(list), 201)
    }
  }
  if ((m = path.match(/^\/me\/todo\/lists\/([^/]+)$/))) {
    const list = lists.find((l) => l.id === decode(m[1]))
    if (method === "GET") return list ? json(toGraphList(list)) : graphError(404, "ErrorItemNotFound", "List not found")
    if (method === "PATCH" && list) {
      if (body?.displayName) list.displayName = body.displayName
      return json(toGraphList(list))
    }
    if (method === "DELETE") {
      const i = lists.findIndex((l) => l.id === decode(m[1]))
      if (i >= 0) lists.splice(i, 1)
      return empty()
    }
  }

  // ───── görevler ─────
  if ((m = path.match(/^\/me\/todo\/lists\/([^/]+)\/tasks$/))) {
    const list = lists.find((l) => l.id === decode(m[1]))
    if (!list) return graphError(404, "ErrorItemNotFound", "List not found")
    if (method === "GET") {
      const withSteps = /checklistItems/i.test(url.searchParams.get("$expand") ?? "")
      return paged(url, filterTasks(url, list.tasks), (t) => toGraphTask(t, { withSteps }))
    }
    if (method === "POST") {
      const now = new Date()
      const t = {
        id: `AAMkADdemoTaskNew${uid("t").replace(/[^a-z0-9]/gi, "")}`,
        title: body?.title ?? "Yeni görev",
        status: body?.status ?? "notStarted",
        importance: body?.importance ?? "normal",
        due: body?.dueDateTime ? dayFrom(body.dueDateTime.dateTime) : null,
        completed: null,
        created: now,
        modified: now,
        note: body?.body?.content ?? "",
        steps: [],
      }
      list.tasks.unshift(t)
      return json(toGraphTask(t, { withSteps: true }), 201)
    }
  }

  if ((m = path.match(/^\/me\/todo\/lists\/([^/]+)\/tasks\/([^/]+)(?:\/(checklistItems|linkedResources)(?:\/([^/]+))?)?$/))) {
    const list = lists.find((l) => l.id === decode(m[1]))
    const task = list?.tasks.find((t) => t.id === decode(m[2]))
    const sub = m[3]
    if (!task) return method === "DELETE" ? empty() : graphError(404, "ErrorItemNotFound", "Task not found")

    if (!sub) {
      if (method === "GET") return json(toGraphTask(task, { withSteps: /checklistItems/i.test(url.searchParams.get("$expand") ?? "") }))
      if (method === "PATCH") {
        applyTaskPatch(task, body)
        return json(toGraphTask(task, { withSteps: true }))
      }
      if (method === "DELETE") {
        list.tasks = list.tasks.filter((t) => t !== task)
        return empty()
      }
    }
    if (sub === "linkedResources") return json({ value: [] })
    if (sub === "checklistItems") {
      const stepId = m[4] && decode(m[4])
      if (!stepId) {
        if (method === "GET") return paged(url, task.steps)
        if (method === "POST") {
          const s = { id: `AAMkADdemoStepNew${uid("s").replace(/[^a-z0-9]/gi, "")}`, displayName: body?.displayName ?? "", isChecked: false, createdDateTime: new Date().toISOString() }
          task.steps.push(s)
          return json(s, 201)
        }
      } else {
        const step = task.steps.find((s) => s.id === stepId)
        if (method === "PATCH" && step) {
          if ("displayName" in (body ?? {})) step.displayName = body.displayName
          if ("isChecked" in (body ?? {})) step.isChecked = body.isChecked
          return json(step)
        }
        if (method === "DELETE") {
          task.steps = task.steps.filter((s) => s.id !== stepId)
          return empty()
        }
      }
    }
  }
  return null
}

export { addDays, startOfDay, CTX }
