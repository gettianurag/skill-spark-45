-- Update Python to Java in skills table
UPDATE public.skills 
SET name = 'Java'
WHERE name = 'Python';

-- Also add C++ as a popular programming language
INSERT INTO public.skills (name, category) 
VALUES ('C++', 'Programming')
ON CONFLICT (name) DO NOTHING;