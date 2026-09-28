// Le client Supabase est chargé à part : la page d'accueil s'affiche sans l'attendre.
export const getSupabase = () => import('../supabaseClient').then((module) => module.supabase);
