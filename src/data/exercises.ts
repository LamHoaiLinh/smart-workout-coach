import { exerciseChunk1 } from './exercises1'
import { exerciseChunk2 } from './exercises2'
import { exerciseChunk3 } from './exercises3'
import { exerciseChunk4 } from './exercises4'
import { exerciseChunk5 } from './exercises5'

export const exercises = [...exerciseChunk1, ...exerciseChunk2, ...exerciseChunk3, ...exerciseChunk4, ...exerciseChunk5]
export const exerciseById = new Map(exercises.map(e => [e.id, e]))
export const allEquipment = Array.from(new Set(exercises.flatMap(e => e.equipment))).filter(Boolean).sort()
